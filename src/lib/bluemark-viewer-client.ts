import type { At } from "@atcute/client/lexicons";
import type { KittyAgent } from "kitty-agent";

export class BluemarkViewerClient {
    constructor(private readonly loginState: {
        readonly handle: string;
        readonly did: At.DID;
        readonly pds: string;
        readonly agent: KittyAgent;
    }) {}

    get agent(): KittyAgent {
        return this.loginState.agent;
    }

    get user() {
        return this.loginState;
    }

}