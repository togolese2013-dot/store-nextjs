/* ============================================================
   UIProvider — React context that wires the full interaction layer.
   ============================================================ */
import React, {
  createContext, useContext, useState, useMemo,
  useEffect, useRef, useCallback,
  type ReactNode,
} from "react";

import { SchemaForm }    from "./SchemaForm";
import { DetailDrawer }  from "./DetailDrawer";
import { ExportModal, ImportModal, AIDrawer, HistoryDrawer,
         NotifPanel, FilterPanel, CommandPalette }  from "./overlays";
import { Modal }         from "./shell";
import { MenuLayer, PopLayer, Toasts } from "./layers";
import { Icons }         from "./icons";
import type {
  AppConfig, UIApi, MenuItem, Align, ConfirmOptions,
  HistoryEvent, FormMode,
} from "./types";

/* ---- Config context --------------------------------------- */
const ConfigCtx = createContext<AppConfig>({ name: "App" });
export function useConfig(): AppConfig { return useContext(ConfigCtx); }

/* ---- UI API context --------------------------------------- */
const UICtx = createContext<UIApi | null>(null);
export function useUI(): UIApi {
  const ctx = useContext(UICtx);
  if (!ctx) throw new Error("useUI() must be called inside <UIProvider>.");
  return ctx;
}

/* ---- Internal state shapes -------------------------------- */
type DrawerState =
  | { type: "form";    kind: string; mode: FormMode; data?: any }
  | { type: "detail";  kind: string; row: any }
  | { type: "ai" }
  | { type: "history"; title?: string; events?: HistoryEvent[] };

type ModalState =
  | { type: "export"; scope: string }
  | { type: "import"; scope: string }
  | ({ type: "confirm" } & ConfirmOptions);

interface MenuState { rect: DOMRect; items: MenuItem[]; align: Align; }
interface PopState  { rect: DOMRect; render: (c: () => void) => ReactNode; align: Align; width?: number; }
interface ToastItem { id: number; msg: string; }

/* ---- Provider --------------------------------------------- */
interface UIProviderProps {
  config: AppConfig;
  onNavigate?: (page: string) => void;
  children: ReactNode;
}

export function UIProvider({ config, onNavigate, children }: UIProviderProps) {
  const [drawer,  setDrawer]  = useState<DrawerState | null>(null);
  const [modal,   setModal]   = useState<ModalState  | null>(null);
  const [menu,    setMenu]    = useState<MenuState    | null>(null);
  const [pop,     setPop]     = useState<PopState     | null>(null);
  const [palette, setPalette] = useState(false);
  const [toasts,  setToasts]  = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((msg: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const closeAll     = useCallback(() => { setMenu(null); setPop(null); }, []);
  const closeOverlay = useCallback(() => { setDrawer(null); setModal(null); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") {
        setDrawer(null); setModal(null); setMenu(null); setPop(null); setPalette(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const api = useMemo<UIApi>(() => ({
    config,
    openForm:    (kind, mode = "create", data) => setDrawer({ type: "form", kind, mode, data }),
    openDetail:  (kind, row)                   => setDrawer({ type: "detail", kind, row }),
    openAI:      ()                            => setDrawer({ type: "ai" }),
    openHistory: (title, events)               => setDrawer({ type: "history", title, events }),
    openExport:  (scope) => setModal({ type: "export", scope }),
    openImport:  (scope) => setModal({ type: "import", scope }),
    openPalette: ()      => setPalette(true),

    menu: (e, items, align = "left") => {
      e.stopPropagation();
      setMenu({ rect: e.currentTarget.getBoundingClientRect(), items, align });
    },
    popover: (e, render, opts = {}) => {
      e.stopPropagation();
      setPop({ rect: e.currentTarget.getBoundingClientRect(), render, align: opts.align ?? "left", width: opts.width });
    },
    notifications: (e) => {
      e.stopPropagation();
      setPop({
        rect:  e.currentTarget.getBoundingClientRect(),
        align: "right", width: 360,
        render: (close) => <NotifPanel onClose={close} toast={toast} />,
      });
    },
    filters: (e) => {
      e.stopPropagation();
      setPop({
        rect:  e.currentTarget.getBoundingClientRect(),
        align: "left", width: 280,
        render: (close) => <FilterPanel onClose={close} toast={toast} />,
      });
    },

    confirm: (opts) => setModal({ type: "confirm", ...opts }),

    confirmDelete: (label, name, opts) =>
      setModal({
        type: "confirm", tone: "danger",
        icon: <Icons.trash size={18} />,
        title: `Supprimer ${label} ?`,
        sub: `« ${name} » sera définitivement supprimé. Cette action est irréversible.`,
        confirmLabel: "Supprimer",
        onConfirm: () => {
          opts?.onConfirm?.();
          toast(`${label.charAt(0).toUpperCase() + label.slice(1)} supprimé`);
        },
      }),

    confirmArchive: (label, name, opts) =>
      setModal({
        type: "confirm",
        icon: <Icons.archive size={18} />,
        title: `Archiver ${label} ?`,
        sub: `« ${name} » sera déplacé vers les archives. Vous pourrez le restaurer.`,
        confirmLabel: "Archiver",
        onConfirm: () => {
          opts?.onConfirm?.();
          toast(`${label.charAt(0).toUpperCase() + label.slice(1)} archivé`);
        },
      }),

    toast,
    navigate: (pg) => onNavigate?.(pg),
  }), [config, onNavigate, toast]);

  const overlayOpen = !!(drawer || modal);

  return (
    <ConfigCtx.Provider value={config}>
      <UICtx.Provider value={api}>
        {children}

        {overlayOpen && (
          <div className="ux-backdrop" onMouseDown={closeOverlay} />
        )}

        {drawer?.type === "form" && (
          <SchemaForm
            kind={drawer.kind} mode={drawer.mode} data={drawer.data}
            onClose={() => setDrawer(null)} toast={toast}
          />
        )}
        {drawer?.type === "detail" && (
          <DetailDrawer
            kind={drawer.kind} row={drawer.row}
            onClose={() => setDrawer(null)} ui={api}
          />
        )}
        {drawer?.type === "ai" && (
          <AIDrawer onClose={() => setDrawer(null)} toast={toast} />
        )}
        {drawer?.type === "history" && (
          <HistoryDrawer
            title={drawer.title} events={drawer.events}
            onClose={() => setDrawer(null)}
          />
        )}

        {modal?.type === "export" && (
          <ExportModal scope={modal.scope} onClose={() => setModal(null)} toast={toast} />
        )}
        {modal?.type === "import" && (
          <ImportModal scope={modal.scope} onClose={() => setModal(null)} toast={toast} />
        )}
        {modal?.type === "confirm" && (
          <Modal
            icon={modal.icon} tone={modal.tone}
            title={modal.title} sub={modal.sub}
            onClose={() => setModal(null)}
            footer={
              <>
                <button className="btn" onClick={() => setModal(null)}>Annuler</button>
                <button
                  className={`btn${modal.tone === "danger" ? "" : " pri"}`}
                  style={modal.tone === "danger" ? { background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" } : undefined}
                  onClick={() => { const f = modal.onConfirm; setModal(null); f?.(); }}
                >
                  {modal.confirmLabel ?? "Confirmer"}
                </button>
              </>
            }
          />
        )}

        {menu && (
          <div className="ux-catch" onMouseDown={closeAll}>
            <MenuLayer {...menu} onClose={closeAll} />
          </div>
        )}
        {pop && (
          <div className="ux-catch" onMouseDown={closeAll}>
            <PopLayer {...pop} onClose={closeAll} />
          </div>
        )}

        {palette && (
          <>
            <div className="ux-backdrop" onMouseDown={() => setPalette(false)} />
            <CommandPalette
              onClose={() => setPalette(false)}
              navigate={(pg) => api.navigate(pg)}
              ui={api}
            />
          </>
        )}

        <Toasts toasts={toasts} />
      </UICtx.Provider>
    </ConfigCtx.Provider>
  );
}
