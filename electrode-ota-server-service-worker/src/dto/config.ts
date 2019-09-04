export default type ConfigDTO = {
  public exec: string;
  public args: string[];
  public numberWorkers?: number;
  public cwd?: string;
  public execArgv?: string[];
}
