import { useAuth } from "react-oidc-context";
import { useCheckUserLoggedIn } from "../hooks/useCheckUserLoggedIn";

const ViewWarbrobe = () => {
    const auth = useAuth();

    const { isLoading, isAuthenticated } = useCheckUserLoggedIn(auth);
    
      if (isLoading || !isAuthenticated) {
        return null;
      } else { 
        return ( 
        <h1>This is View Warbrobe Screen!</h1>
     );
      }
    
}
 
export default ViewWarbrobe;