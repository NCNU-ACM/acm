import {
  cloneElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import { flushSync } from 'react-dom';

// 以 key 換掉單一子元素時的進出場轉場：換 key 後新舊元素會同時存在，直到舊元素離場結束。
// class 名稱是 `${name}-enter-from` 等，序列如下：
//   進場  enter-from + enter-active → 兩個 frame 後 enter-from 換成 enter-to → transition 結束後移除 enter-to、enter-active
//   離場  leave-from → 強制 reflow → leave-active → 兩個 frame 後 leave-from 換成 leave-to → 結束後移除元素
// 離場元素套用的是「換 key 那一次 render」的 name，所以連續切換時 slide-left / slide-right 的方向由最近一次切換決定。
// class 是直接操作 DOM 加上去的：子元素的 className prop 不能是動態的，React 才不會覆蓋它們。

interface Props {
  name: string;
  /** CSS Module：需要有 `${name}-enter-from` 等 class */
  styles: Record<string, string>;
  /** 單一、帶 key 的元素，換 key 就會觸發轉場 */
  children: ReactElement<{ ref?: Ref<HTMLElement> }>;
}

interface Leaving {
  id: string;
  element: ReactElement<{ ref?: Ref<HTMLElement> }>;
  name: string;
}

const nextFrame = (cb: () => void) => {
  let second = 0;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(cb);
  });
  return () => {
    cancelAnimationFrame(first);
    cancelAnimationFrame(second);
  };
};

const toMs = (s: string) => (s === 'auto' ? 0 : Number(s.slice(0, -1).replace(',', '.')) * 1000);

// 等 transitionend 事件收齊（每個屬性一個），並以總時間 + 1ms 的 timeout 作保險（事件沒觸發時仍會結束）
const whenTransitionEnds = (el: HTMLElement, resolve: () => void) => {
  const s = getComputedStyle(el);
  let delays = s.transitionDelay.split(', ');
  const durations = s.transitionDuration.split(', ');
  while (delays.length < durations.length) delays = delays.concat(delays);
  const timeout = Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
  if (timeout <= 0) {
    resolve();
    return () => {};
  }
  const propCount = durations.length;
  let ended = 0;
  const end = () => {
    el.removeEventListener('transitionend', onEnd);
    clearTimeout(timer);
    resolve();
  };
  const onEnd = (e: Event) => {
    if (e.target === el && ++ended >= propCount) end();
  };
  const timer = setTimeout(() => {
    if (ended < propCount) end();
  }, timeout + 1);
  el.addEventListener('transitionend', onEnd);
  return () => {
    el.removeEventListener('transitionend', onEnd);
    clearTimeout(timer);
  };
};

interface SlotProps {
  element: ReactElement<{ ref?: Ref<HTMLElement> }>;
  name: string;
  styles: Record<string, string>;
  /** 是否在掛載時播進場（第一次 render 不播） */
  enter: boolean;
  leaving: boolean;
  onLeft: () => void;
}

// 一個元素一個 Slot：同一個 Slot 從「目前」變成「離場」時 DOM 節點不會重建
function Slot({ element, name, styles, enter, leaving, onLeft }: SlotProps) {
  const node = useRef<HTMLElement | null>(null);
  const cancelEnter = useRef<(() => void) | null>(null);
  const cancelLeave = useRef<(() => void) | null>(null);
  // enter-to、leave-from 在 CSS 裡沒有規則，CSS Modules 不會輸出它們（styles[...] 為 undefined）；退回字面名稱，class 序列才完整
  const cls = (phase: string) => styles[`${name}-${phase}`] ?? `${name}-${phase}`;

  useLayoutEffect(() => {
    const el = node.current;
    if (!enter || !el) return;
    // 在繪製前加上起始態，避免元素先以終態閃現一格
    el.classList.add(cls('enter-from'), cls('enter-active'));
    let stopWait = () => {};
    const stopFrame = nextFrame(() => {
      el.classList.remove(cls('enter-from'));
      el.classList.add(cls('enter-to'));
      stopWait = whenTransitionEnds(el, () => {
        el.classList.remove(cls('enter-to'), cls('enter-active'));
        cancelEnter.current = null;
      });
    });
    cancelEnter.current = () => {
      stopFrame();
      stopWait();
      el.classList.remove(cls('enter-from'), cls('enter-to'), cls('enter-active'));
      cancelEnter.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const el = node.current;
    if (!leaving || !el) return;
    // 進場到一半就離場：先取消進場（停掉等待並移除進場 class）
    cancelEnter.current?.();
    el.classList.add(cls('leave-from'));
    void el.offsetHeight; // forceReflow
    el.classList.add(cls('leave-active'));
    let stopWait = () => {};
    const stopFrame = nextFrame(() => {
      el.classList.remove(cls('leave-from'));
      el.classList.add(cls('leave-to'));
      stopWait = whenTransitionEnds(el, () => {
        el.classList.remove(cls('leave-to'), cls('leave-active'));
        // 同一個 task 內卸載：否則拿掉 class 後、卸載前的那一段時間，舊 slide 會以原位、不透明的狀態閃回版面
        flushSync(onLeft);
      });
    });
    cancelLeave.current = () => {
      stopFrame();
      stopWait();
    };
  }, [leaving]);

  useLayoutEffect(
    () => () => {
      cancelEnter.current?.();
      cancelLeave.current?.();
    },
    [],
  );

  return cloneElement(element, {
    ref: (el: HTMLElement | null) => {
      node.current = el;
    },
  });
}

export default function SlideTransition({ name, styles, children }: Props) {
  const key = String(children.key);
  // gen 讓「同一個 key 在離場期間又回來」（例如 0 → 1 → 0 快速連點）不會與離場中的舊元素撞 key
  const [state, setState] = useState<{ key: string; gen: number; leaving: Leaving[] }>({
    key,
    gen: 0,
    leaving: [],
  });
  const lastElement = useRef(children);

  if (key !== state.key) {
    // 換 key：把上一個元素移進離場清單，凍結它的內容與這一次的 name。
    // 在 render 中更新自己的 state，React 會在 commit 前立刻重跑，DOM 節點得以保留
    setState({
      key,
      gen: state.gen + 1,
      leaving: [
        ...state.leaving,
        { id: `${state.key}#${state.gen}`, element: lastElement.current, name },
      ],
    });
  }

  useLayoutEffect(() => {
    lastElement.current = children;
  });

  const removeLeaving = useCallback((id: string) => {
    setState((s) => ({ ...s, leaving: s.leaving.filter((l) => l.id !== id) }));
  }, []);

  // 離場的與目前的放在同一個 keyed 陣列，元素從「目前」變成「離場」時 React 才會沿用同一個 DOM 節點
  return (
    <>
      {[
        ...state.leaving.map((l) => (
          <Slot
            key={l.id}
            element={l.element}
            name={l.name}
            styles={styles}
            enter={false}
            leaving
            onLeft={() => removeLeaving(l.id)}
          />
        )),
        <Slot
          key={`${state.key}#${state.gen}`}
          element={children}
          name={name}
          styles={styles}
          enter={state.gen > 0}
          leaving={false}
          onLeft={() => {}}
        />,
      ]}
    </>
  );
}
