import { StoreProvider } from "./store";
import { ThemeApplier, TopSwitcher, useRoute } from "./components/Shell";
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
  const [route, setRoute] = useRoute();
  return (
    <>
      <TopSwitcher route={route} setRoute={setRoute} />
      {route === "site" && <Site />}
      {route === "admin" && <Admin />}
      {route === "pdv" && <PDV />}
    </>
  );
}
