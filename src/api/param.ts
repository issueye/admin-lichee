import request from '../utils/request';

// 获取参数域列表
export const apiAreaList = (params: any) => {
    return request({
        url: 'api/area',
        method: 'get',
        params: params
    });
}