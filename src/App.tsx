import { StoreProvider } from "./store";
import { ThemeApplier, TopLinks, useRoute } from "./components/Shell";
import Site from "./pages/Site";
import Admin from "./pages/Admin";
import PDV from "./pages/PDV";

export default function App() {
  return (
    <StoreProvider>
      <ThemeApplier />
      <Inner />
    </StoreProvider>
  );
}

function Inner() {
  const route = useRoute();
  return (
    <>
      <TopLinks current={route} />
      {route === "site" && <Site />}
      {route === "admin" && <Admin />}
      {route === "pdv" && <PDV />}
    </>
  );
}
