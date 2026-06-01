import { useEffect, useRef } from "react";

interface Props {
  blockId: string;
  type?: string;
  suffix?: string;
}

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (params: object) => void;
        };
      };
    };
  }
}

export default function YandexAd({ blockId, type = "topAd", suffix = "1" }: Props) {
  const divId = `yandex_rtb_${blockId.replace(/-/g, "_")}_${suffix}`;
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    rendered.current = true;

    const doRender = () => {
      window.Ya?.Context?.AdvManager?.render({ blockId, type, renderTo: divId });
    };

    if (window.Ya?.Context?.AdvManager) {
      doRender();
    } else {
      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(doRender);
    }
  }, [blockId, divId]);

  return <div id={divId} style={{ width: "100%", minHeight: 90 }} />;
}