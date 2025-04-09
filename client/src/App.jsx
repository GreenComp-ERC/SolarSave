import { Navbar,SolarPredict, Footer, Transactions, MapSection,  Store, SolarTrade, SolarToken} from "./components";
const App = () => (
  <div className="min-h-screen">
    <div className="gradient-bg-welcome">
        <Navbar />
        <MapSection />
        <SolarPredict />



    </div>
    <SolarTrade />
    <Transactions />

  </div>
);

export default App;
