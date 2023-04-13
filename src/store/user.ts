import { defineStore } from 'pinia';
import { userLogin } from '../api/user';

export interface LInfo {
    account: string;
    password: string;
}


export const userStore = defineStore('user', {
    state: () => {
        return {
            loginInfo: {
                account: '',
                password: ''
            },
        }
    },
    getters: {},
    actions: {
        // 用户登录
        async login(info: LInfo) {
            let { data } = await userLogin(info);
            console.log('actions.login.data', data);
            if (data.code == 200) {
                let token: string = data.data.token;

                // 保存到 storage
                localStorage.setItem('token', token);
                // 保存 用户登录信息
                this.loginInfo.account = info.account;
                this.loginInfo.password = info.password;
                return true
            } else {
                return false
            }
        }
    }
})