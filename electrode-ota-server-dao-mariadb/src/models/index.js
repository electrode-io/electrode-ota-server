export default client => {
  const sources = [
    "App", // + AppCollaborator, AppDeployment, Deployment, DeploymentHistory
    "ClientRatio",
    "Metric",
    "Package", // + PackageDiff
    "PackageContent",
    "User" // + UserAccessKey
  ];
  for (const source of sources) {
    client.import(source);
  }
};
