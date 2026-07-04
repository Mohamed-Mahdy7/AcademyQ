import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import MainRouter from "./routes/MainRouter";


function App() {
  console.log("App rendered");
  return <MainRouter/>;
}

export default App;
