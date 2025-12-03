import { requestAddresses } from "viem/actions";

export const protectedRoutes = [
  "/home",
  "/welcome",
  "/payments",
  "/bills",
  "/settings",
];
export const publicRoutes = ["/", "/login", "/signup", "/claim", "/i", "/pay"];
export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  about: "/about",
  faucet: "/faucet",
  app: {
    home: "/home",
    payments: {
      index: "/payments",
      create: "/payments/create",
    },
    funding: {
      index: "/funding",
      create: "/funding/create",
      pay: "/funding/pay",
    },
    taxes: {
      index: '/taxes'
    },
    savings: {
      index: "/savings",
      id: (id: string) => `/savings/${id}`,
    },
    transaction: {
      index: "/transactions",
      id: (id: string) => `/transactions/${id}`,
    },
    settings: "/settings",
  },
};
