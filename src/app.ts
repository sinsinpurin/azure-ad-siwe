import express from "express";
import Provider, { ClientAuthMethod, ResponseType } from "oidc-provider";

// Configuration for the OIDC provider
const configuration = {
    clients: [
        {
            client_id: "sample-client",
            client_secret: "sample-secret",
            redirect_uris: ["http://localhost:3000/cb"],
            response_types: ["code"] as ResponseType[],
            grant_types: ["authorization_code"],
            token_endpoint_auth_method:
                "client_secret_basic" as ClientAuthMethod,
        },
    ],
    features: {
        devInteractions: { enabled: false },
    },
};

// In-memory user database
const users = [
    {
        id: 1,
        email: "sample@example.com",
        password: "password",
    },
];

// Find a user by email and password
function findUser(email: string, password: string) {
    return users.find(
        (user) => user.email === email && user.password === password,
    );
}

// Custom authentication middleware
async function authenticate(ctx: any, next: any) {
    if (ctx.oidc.route === "authorization" && ctx.request.method === "POST") {
        const email = ctx.request.body.email;
        const password = ctx.request.body.password;
        const user = findUser(email, password);

        if (user) {
            ctx.login(user);
        } else {
            ctx.throw(401, "Invalid email or password");
        }
    }

    return next();
}

(async () => {
    const oidc = new Provider("http://localhost:3000", configuration);
    oidc.use(authenticate);

    const app = express();
    app.use(oidc.callback());

    app.listen(3000, () => {
        console.log("OIDC provider listening on http://localhost:3000");
    });
})();
