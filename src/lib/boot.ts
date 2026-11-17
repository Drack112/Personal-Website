const BOOTED_KEY = 'lk.booted'

export const hasBooted = () => sessionStorage.getItem(BOOTED_KEY) !== null
export const markBooted = () => sessionStorage.setItem(BOOTED_KEY, '1')
export const forgetBooted = () => sessionStorage.removeItem(BOOTED_KEY)
