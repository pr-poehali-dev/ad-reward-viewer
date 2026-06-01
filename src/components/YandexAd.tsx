import { useEffect, useRef } from "react";

interface Props {
  blockId: string;
  suffix?: string;
  onLoad?: () => void;
}

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (params: { blockId: string; renderTo: string; onRender?: () => void }) => void;
        };
      };
    };
  }
}

export default function YandexAd({ blockId, suffix = "1", onLoad }: Props) {
  const containerId = `yandex-ad-${blockId}-${suffix}`;
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    rendered.current = true;

    const render = () => {
      window.Ya?.Context?.AdvManager?.render({
        blockId,
        renderTo: containerId,
        onRender: onLoad,
      });
    };

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(render);

    // Если скрипт уже загружен — рендерим сразу
    if (window.Ya?.Context?.AdvManager) {
      render();
    }
  }, [blockId, containerId, onLoad]);

  return (
    <div
      id={containerId}
      className="w-full"
      style={{ minHeight: 100 }}
    />
  );
}