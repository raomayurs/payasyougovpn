import { App, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Repository, Code } from "aws-cdk-lib/aws-codecommit";
import { PayAsYouGoVPNFrontendStack } from "./PayAsYouGoVPNFrontendStack";
import { PayAsYouGoVPNServiceStack } from "./PayAsYouGoVPNServiceStack";
import * as path from "path";

export class PayAsYouGoVPNBaseStack extends Stack {
    constructor(scope: App, id: string, props: StackProps) {
        super(scope, id, props);
        const payAsYouGoVPNRepo = this.createCodeCommitRepository();
        this.createChildStacks(payAsYouGoVPNRepo);
    }

    private createCodeCommitRepository() {
        const codePath = path.join(path.dirname(path.dirname(__dirname)), "code.zip");
        const payAsYouGoVPNRepo = new Repository(
            this,
            "PayAsYouGoVPN",
            {
              repositoryName: "payasyougovpn",
              description:
                "CodeCommit repository that will be used as the source repository for the pay as you go vpn app",
                code: Code.fromZipFile(codePath, "master")
            }
        );

        return payAsYouGoVPNRepo;
    }

    private createChildStacks(payAsYouGoVPNRepo: Repository) {
        const backendStack = new PayAsYouGoVPNServiceStack(this, "PayAsYouGoVPNServiceStack");
        const frontendStack = new PayAsYouGoVPNFrontendStack(this, "PayAsYouGoVPNFrontendStack", { 
            repositoryArn: payAsYouGoVPNRepo.repositoryArn,
            repositoryCloneUrl: payAsYouGoVPNRepo.repositoryCloneUrlHttp 
        });
        frontendStack.node.addDependency(payAsYouGoVPNRepo);
        frontendStack.node.addDependency(backendStack);
    }
}