import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import MainRouter from "./routes/MainRouter";


function App() {
  const { loading } = useContext(AuthContext);
  
      if (loading) {
          return <p>Loading...</p>;
      }

  return (
    <> 
      <MainRouter/>
    </>   
  )
}

export default App;
