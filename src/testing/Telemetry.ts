export type TelemetryState = Record<string, number | boolean | string>;

export class Telemetry {
  private readonly output: HTMLOutputElement;

  constructor(selector = "#telemetry") {
    const output = document.querySelector<HTMLOutputElement>(selector);
    if (!output) throw new Error(`Telemetry output not found: ${selector}`);
    this.output = output;
  }

  update(state: TelemetryState): void {
    this.output.textContent = JSON.stringify(state);
    Object.entries(state).forEach(([key, value]) => {
      this.output.dataset[key] = String(value);
    });
  }
}
