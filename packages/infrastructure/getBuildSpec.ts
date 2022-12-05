export const getBuildSpec = (userPoolId: string, identityPoolId: string, clientId: string, region: string) => {
    const data = `version: 1\n` +
                 `frontend:\n` +
                 `  phases:\n` +
                 `    build:\n` +
                 `      commands:\n` +
                 `        - npm run createEnvironmentFile -- ${userPoolId} ${clientId} ${identityPoolId} ${region}\n` +
                 `        - npm run buildWebApp\n` +
                 `  artifacts:\n` +
                 `    baseDirectory: build\n` +
                 `    files:\n` +
                 `      - '**/*'\n` +
                 `  cache:\n` +
                 `    paths:\n` +
                 `      - packages/webApp/node_modules/**/*\n`
    
    return data;
}