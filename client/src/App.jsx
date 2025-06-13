import { Navbar,SolarPredict, Footer, Transactions, MapSection,  Store, SolarTrade, SolarToken, TestSolarAPI} from "./components";
const App = () => (
  <div className="min-h-screen flex flex-col">
    <div className="gradient-bg-welcome">
      <Navbar />
      <MapSection />
    </div>

    <div className="bg-black py-6 px-4 relative z-10 min-h-[800px]">
      <SolarPredict />
    </div>

    <div className="bg-gray-900 py-6 px-4 relative z-0">
      <SolarTrade />
    </div>

    <div className="bg-gray-800 py-6 px-4 relative z-0">
      <Transactions />
    </div>

    <Footer />
  </div>
);

export default App;
