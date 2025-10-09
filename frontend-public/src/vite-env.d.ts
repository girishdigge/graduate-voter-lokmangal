// Vite environment types
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_TITLE?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: string[], cb: (mods: any[]) => void): void;
    dispose(cb: () => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (...args: any[]) => void): void;
  };
}

declare module 'react' {
  export interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }

  export function useState<S>(
    initialState: S | (() => S)
  ): [S, (value: S | ((prevState: S) => S)) => void];
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ): T;
  export function useEffect(
    effect: () => void | (() => void),
    deps?: any[]
  ): void;

  export interface ChangeEvent<T = Element> {
    target: T;
  }

  const React: any;
  export default React;
}

declare module 'react-dom' {
  export * from 'react-dom';
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  export const Users: LucideIcon;
  export const Plus: LucideIcon;
  export const Upload: LucideIcon;
  export const FileText: LucideIcon;
  export const Share2: LucideIcon;
  export const Smartphone: LucideIcon;
  export const X: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Clock: LucideIcon;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
