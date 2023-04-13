import request from '../utils/request';

// apiJobCreate
// 创建用户任务
export const apiJobCreate = (data: any) => {
    return request({
        url: 'api/job',
        method: 'post',
        data: data,
    });
}

// apiJobList
// 获取任务列表
export const apiJobList = (params: any) => {
    return request({
        url: 'api/job',
        method: 'get',
        params: params
    });
}