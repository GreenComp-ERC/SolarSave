import { Navbar,SolarPredict, Footer, Transactions, MapSection,  Store, SolarTrade, SolarToken, TestSolarAPI} from "./components";
const App = () => (
  <div className="min-h-screen flex flex-col">
    <div className="gradient-bg-welcome">
      <Navbar />

      <MapSection />
    </div>

    {/* 将 SolarPredict 从 gradient-bg-welcome 中独立出来 */}
    <div className="bg-black py-6 px-4">
      <SolarPredict />
    </div>

    <div className="bg-gray-900 py-6 px-4">
      <SolarTrade />
    </div>

    <div className="bg-gray-800 py-6 px-4">
      <Transactions />
        {/*<TestSolarAPI/>*/}
    </div>

    <Footer />
  </div>
);


export default App;
