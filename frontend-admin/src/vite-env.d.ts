/// <reference types="vite/client" />

// Vite environment types
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_TITLE?: string;
  readonly MODE?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
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
  export function useRef<T>(initialValue: T): { current: T };
  export function useContext<T>(context: any): T;
  export function createContext<T>(defaultValue: T): any;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: any) => JSX.Element | null
  ): any;

  export interface ChangeEvent<T = Element> {
    target: T;
  }

  export type ReactNode = any;
  export type ErrorInfo = any;
  export class Component<P = {}, S = {}> {
    props: P;
    constructor(props: P);
    render(): ReactNode;
    setState(state: Partial<S>): void;
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
  }

  const React: any;
  export default React;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  // All icons used in the project
  export const Users: LucideIcon;
  export const User: LucideIcon;
  export const Plus: LucideIcon;
  export const Upload: LucideIcon;
  export const FileText: LucideIcon;
  export const Share2: LucideIcon;
  export const Share: LucideIcon;
  export const Smartphone: LucideIcon;
  export const X: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const Clock: LucideIcon;
  export const Eye: LucideIcon;
  export const Download: LucideIcon;
  export const Printer: LucideIcon;
  export const Edit3: LucideIcon;
  export const Image: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const MapPin: LucideIcon;
  export const Phone: LucideIcon;
  export const Mail: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Save: LucideIcon;
  export const Calendar: LucideIcon;
  export const Check: LucideIcon;
  export const Camera: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const UserCheck: LucideIcon;
  export const LogOut: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Copy: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const QrCode: LucideIcon;
  export const Trash2: LucideIcon;
  export const Vote: LucideIcon;
  export const Shield: LucideIcon;
  export const FileImage: LucideIcon;
  export const Menu: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const UserPlus: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const EyeOff: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Edit: LucideIcon;
  export const Lock: LucideIcon;
  export const UserCircle: LucideIcon;
  export const Minus: LucideIcon;
  export const ChevronsLeft: LucideIcon;
  export const ChevronsRight: LucideIcon;
  export const Info: LucideIcon;
  export const FileSpreadsheet: LucideIcon;
  export const Keyboard: LucideIcon;
  export const SkipBack: LucideIcon;
  export const SkipForward: LucideIcon;
  export const Search: LucideIcon;
  export const Filter: LucideIcon;
  export const Settings: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
}

declare module '*.css' {
  const content: any;
  export default content;
}
