import request from '../utils/request';

// userLogin
// 用户登录
export const userLogin = (params: any) => {
    return request({
        url: 'api/login',
        method: 'post',
        data: params,
    });
}