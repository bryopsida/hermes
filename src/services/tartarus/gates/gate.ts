export interface IGate {
  open(): Promise<void>;
  close(): Promise<void>;
}
