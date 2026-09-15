export type RouteHandler = (main: HTMLElement, params: Record<string, string>) => void | Promise<void>;

interface CompiledRoute {
  readonly pattern: RegExp;
  readonly keys: string[];
  readonly handler: RouteHandler;
}

// ハッシュではなく通常パスでルーティングする(URL共有・GA4計測のため)。
export class Router {
  private readonly routes: CompiledRoute[] = [];
  private notFoundHandler: RouteHandler = (main) => {
    main.textContent = "ページが見つかりません";
  };

  constructor(
    private readonly main: HTMLElement,
    private readonly onNavigate?: (path: string) => void,
  ) {
    window.addEventListener("popstate", () => this.render(window.location.pathname));
    document.addEventListener("click", (event) => this.handleLinkClick(event));
  }

  add(path: string, handler: RouteHandler): void {
    const keys: string[] = [];
    const pattern = new RegExp(
      `^${path.replace(/:[a-zA-Z]+/g, (segment) => {
        keys.push(segment.slice(1));
        return "([^/]+)";
      })}$`,
    );
    this.routes.push({ pattern, keys, handler });
  }

  notFound(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }

  navigate(path: string): void {
    window.history.pushState({}, "", path);
    void this.render(path);
  }

  start(): void {
    void this.render(window.location.pathname);
  }

  private async render(path: string): Promise<void> {
    this.onNavigate?.(path);
    for (const route of this.routes) {
      const match = route.pattern.exec(path);
      if (match) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1] as string);
        });
        this.main.innerHTML = "";
        await route.handler(this.main, params);
        return;
      }
    }
    this.main.innerHTML = "";
    await this.notFoundHandler(this.main, {});
  }

  private handleLinkClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a[data-link]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    this.navigate(anchor.pathname);
  }
}
