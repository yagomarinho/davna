export function wait(milis: number = 1000) {
  return new Promise(resolve => {
    setTimeout(resolve, milis)
  })
}
