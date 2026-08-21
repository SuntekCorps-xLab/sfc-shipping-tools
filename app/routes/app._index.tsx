import type {HeadersFunction, LoaderFunctionArgs} from "react-router";
import {authenticate} from "../shopify.server";
import {boundary} from "@shopify/shopify-app-react-router/server";

export const loader = async ({request}: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page heading="SFC Shipping Tools">
      <s-section heading="App installed">
        <s-paragraph>
          The Shopify app shell is connected. Add the SFC Shipping Tools app
          block to a compatible Online Store 2.0 theme to expose the storefront
          interface.
        </s-paragraph>
      </s-section>

      <s-section heading="Production checklist">
        <s-unordered-list>
          <s-list-item>Configure and verify the Shopify App Proxy.</s-list-item>
          <s-list-item>
            Keep Shopify and SFC credentials in the backend secret store.
          </s-list-item>
          <s-list-item>
            Enforce customer ownership, account approval, and shipment cargo
            screening on the server.
          </s-list-item>
          <s-list-item>
            Test rate, tracking, document, order, and label authorization in a
            development store before release.
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Documentation">
        <s-paragraph>
          Review the public API contract and deployment checklist in this
          repository before enabling the extension in a live theme.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
