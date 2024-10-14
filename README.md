### Prerequisites

Before you begin, you'll need the following:

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.

## Installation and Setup
### install the Shopify CLI :

```bash
npm install -g @shopify/cli@latest
```
### Clone the Repository:

```bash
git clone https://github.com/ahmedbm27/webnorth-back
cd webnorth-back
```

### Add the fowolling data to the .env file:

```bash
APP_METAFIELD_NAME_SPACE=cart_rule
APP_METAFIELD_KEY=app-configuration
```

### Start a local development server:
```bash
npm install
```

```bash
npm run dev
```

