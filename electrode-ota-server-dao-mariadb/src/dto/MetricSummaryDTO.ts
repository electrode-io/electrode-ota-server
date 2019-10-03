export default class MetricSummaryDTO {
  public id?: number;
  public deploymentId: number;
  public lastRunTimeUTC: Date;
  public lockBy?: string;
  public lockTimeUTC?: Date;
  public summaryJson: string;
}
