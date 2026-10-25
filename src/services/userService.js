import API from './api';
 
export async function getUsers() {
    const { data } = await API.get('/user/drd');
    const users = data?.data?.users;
 
    if (!Array.isArray(users)) {
        throw new Error('The users API returned an invalid response.');
    }
 
    return {
        users,
        totalCount: users.length,
    };
}
 
// GET /user/get/:userId
// The sample response is a flat user object (roleId is an id string, not
// a populated role). We also accept { data: user } in case it gets wrapped.
export async function getUserById(userId) {
    const { data } = await API.get(`/user/get/${userId}`);
    const user = data?.data && !data?._id ? data.data : data;
 
    if (!user || !user._id) {
        throw new Error('The user API returned an invalid response.');
    }
 
    return user;
}
 
export async function createUser(payload) {
    const { data } = await API.post('/user/create', payload);
    return data;
}
 
// PUT /user/update/:userId
// payload example: { personalInfo: { firstName, lastName, mobile } }
// Returns { message, user }
export async function updateUser(userId, payload) {
    const { data } = await API.put(`/user/update/${userId}`, payload);
    return data;
}
 
// PUT /user/change_password/:userId
// Returns { message }
export async function changeUserPassword(userId, newPassword) {
    const { data } = await API.put(`/user/change_password/${userId}`, {
        new_password: newPassword,
    });
    return data;
}
 
// PUT /user/assign_role/:userId
// NOTE: body shape assumed to be { roleId } - adjust if your Postman body differs.
export async function assignUserRole(userId, roleId) {
    const { data } = await API.put(`/user/assign_role/${userId}`, { roleId });
    return data;
}
 
// DELETE /user/delete/:userId
export async function deleteUser(userId) {
    const { data } = await API.delete(`/user/delete/${userId}`);
    return data;
}
 
export async function logoutUser() {
    const { data } = await API.get('/user/logout');
    return data;
}