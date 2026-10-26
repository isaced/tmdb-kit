import { describe, expect, it } from 'bun:test'
import { paginate, paginateItems, type PagedResponse } from '../../src'

function page<T>(pageNumber: number, results: T[], totalPages = 1): PagedResponse<T> {
  return {
    page: pageNumber,
    results,
    total_pages: totalPages,
    total_results: results.length,
  }
}

async function collect<T>(iterator: AsyncGenerator<T>): Promise<T[]> {
  const values: T[] = []

  for await (const value of iterator) {
    values.push(value)
  }

  return values
}

describe('paginate', () => {
  it('iterates every page until total_pages', async () => {
    const requested: number[] = []
    const pages = await collect(
      paginate(async (pageNumber) => {
        requested.push(pageNumber)
        return page(pageNumber, [`item-${pageNumber}`], 3)
      }),
    )

    expect(requested).toEqual([1, 2, 3])
    expect(pages.map((item) => item.page)).toEqual([1, 2, 3])
  })

  it('stops when a page has no results', async () => {
    const requested: number[] = []
    const pages = await collect(
      paginate(async (pageNumber) => {
        requested.push(pageNumber)
        return page(pageNumber, pageNumber === 2 ? [] : ['item'], 5)
      }),
    )

    expect(requested).toEqual([1, 2])
    expect(pages).toHaveLength(2)
  })

  it('respects startPage and endPage', async () => {
    const requested: number[] = []
    await collect(
      paginate(
        async (pageNumber) => {
          requested.push(pageNumber)
          return page(pageNumber, ['item'], 10)
        },
        { endPage: 4, startPage: 3 },
      ),
    )

    expect(requested).toEqual([3, 4])
  })

  it('defaults endPage to 500', async () => {
    const requested: number[] = []
    await collect(
      paginate(async (pageNumber) => {
        requested.push(pageNumber)
        return page(pageNumber, ['item'], 10_000)
      }),
    )

    expect(requested).toHaveLength(500)
    expect(requested.at(-1)).toBe(500)
  })

  it('yields nothing when endPage is lower than startPage', async () => {
    const requested: number[] = []
    const pages = await collect(
      paginate(
        async (pageNumber) => {
          requested.push(pageNumber)
          return page(pageNumber, ['item'], 10)
        },
        { endPage: 2, startPage: 5 },
      ),
    )

    expect(pages).toEqual([])
    expect(requested).toEqual([])
  })

  it('stops before the next request when the signal is aborted', async () => {
    const controller = new AbortController()
    const requested: number[] = []
    const iterator = paginate(
      async (pageNumber) => {
        requested.push(pageNumber)
        controller.abort()
        return page(pageNumber, ['item'], 3)
      },
      { signal: controller.signal },
    )

    const first = await iterator.next()
    expect(first.value?.page).toBe(1)

    const error = await iterator.next().catch((value: unknown) => value)
    expect(error).toBeInstanceOf(DOMException)
    expect((error as DOMException).name).toBe('AbortError')
    expect(requested).toEqual([1])
  })

  it('rejects invalid page bounds', async () => {
    const fetchPage = async () => page(1, [])

    await expect(collect(paginate(fetchPage, { startPage: 0 }))).rejects.toThrow(RangeError)
    await expect(collect(paginate(fetchPage, { endPage: 1.5 }))).rejects.toThrow(RangeError)
  })
})

describe('paginateItems', () => {
  it('flattens page results', async () => {
    const items = await collect(
      paginateItems(async (pageNumber) =>
        page(pageNumber, [`a${pageNumber}`, `b${pageNumber}`], 2),
      ),
    )

    expect(items).toEqual(['a1', 'b1', 'a2', 'b2'])
  })
})
