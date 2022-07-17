export interface IUsableClosable {
  close: () => Promise<void>
}

export async function using<T extends IUsableClosable, R> (resource: T, func: (resource: T) => Promise<R>) {
  let result: R
  try {
    result = await func(resource)
  } finally {
    await resource.close()
  }
  return result
}
