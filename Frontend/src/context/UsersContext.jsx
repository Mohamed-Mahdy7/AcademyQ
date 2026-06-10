import { createContext, useEffect, useState } from "react";
import { 
    getUserRequest, 
    createUserRequest,
    getUsersRequest,
    updateUserRequest,
    deleteUserRequest
} from "../services/usersService";

export const UsersContext = createContext();

export const UsersProvider = ({children}) => {
    const [users, setUsers] = useState([])
    const [user, setUser] = useState(null)

    async function getUser(id) {
        try{
            const response = await getUserRequest(id);
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error(error);
            setUser(null);
            return null;
        }
    }

    async function getUsers() {
        try{
            const response = await getUsersRequest();
            setUsers(response.data);
            return response.data;
        } catch (error) {
            console.error(error);
            setUsers([]);
            return null;
        }
    }

    async function createUser(data) {
        try{
            const response = await createUserRequest(data);
            setUser(response.data);
            await getUsers();

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                error
            };
        }
    }

    async function updateUser(id, data) {
        try{
            const response = await updateUserRequest(id, data);
            setUser(response.data);
            await getUsers();

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                error
            };
        }
    }

    async function deleteUser(id) {
        try{
            await deleteUserRequest(id);
            await getUsers();
        } catch (error) {
            console.error(error);
        } finally {
            setUser(null);
        }
    }

    useEffect(() => {
        getUsers();
    }, []);

    return (
        <UsersContext.Provider
            value={{
                user,
                users,
                getUser,
                getUsers,
                createUser,
                updateUser,
                deleteUser
            }}
        >
            {children}
        </UsersContext.Provider>
    );
}

