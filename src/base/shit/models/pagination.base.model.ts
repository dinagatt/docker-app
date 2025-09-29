import { ParsedQs } from 'qs';

// TYPES
export type SortDirectionType = 'desc' | 'asc';

export type PaginationType = {
  searchNameTerm: string | null;
  sortBy: string;
  sortDirection: SortDirectionType;
  pageNumber: number;
  pageSize: number;
};

//PAGINATION
export class PaginationOutput<D> {
  public readonly pagesCount: number;
  public readonly page: number;
  public readonly pageSize: number;
  public readonly totalCount: number;
  public readonly items: D[];

  constructor(items: D[], page: number, pageSize: number, totalCount: number) {
    this.items = items;
    this.page = page;
    this.pageSize = pageSize;
    this.totalCount = totalCount;

    this.pagesCount = Math.ceil(totalCount / pageSize);
  }
}

export class Pagination {
  public readonly pageNumber: number;
  public readonly pageSize: number;
  public readonly sortDirection: SortDirectionType;
  public readonly sortBy: string;

  constructor(query: ParsedQs, sortProperties: string[]) {
    this.sortBy = this.getSortBy(query, sortProperties);
    this.sortDirection = this.getSortDirection(query);
    this.pageNumber = Number(query.pageNumber ?? 1);
    this.pageSize = Number(query.pageSize ?? 10);
  }

  /* public getSortDirectionInNumericFormat(): -1 | 1 {
    return this.sortDirection === 'desc' ? -1 : 1;
  }*/

  public getSortDirectionInTextFormat(): 'ASC' | 'DESC' {
    return this.sortDirection === 'desc' ? 'DESC' : 'ASC';
  }

  public getSkipItemsCount() {
    return (this.pageNumber - 1) * this.pageSize;
  }

  private getSortDirection(query: ParsedQs): SortDirectionType {
    let sortDirection: SortDirectionType = 'desc';

    switch (query.sortDirection) {
      case 'desc': {
        sortDirection = 'desc';
        break;
      }
      case 'asc': {
        sortDirection = 'asc';
        break;
      }
    }
    return sortDirection;
  }

  private getSortBy(query: ParsedQs, sortProperties: string[]): string {
    let result = 'createdAt';

    const querySortBy = query.sortBy;

    if (querySortBy === undefined) {
      return result;
    }

    // If query property sent as Array
    if (Array.isArray(querySortBy)) {
      for (let i: number = 0; i < querySortBy.length; i++) {
        const param = querySortBy[i];

        if (sortProperties.includes(param.toString())) {
          result = param.toString();
          break;
        }
      }
    } else {
      if (sortProperties.includes(querySortBy.toString())) {
        result = querySortBy.toString();
      }
    }

    return result;
  }
}

export class PaginationWithSearchLoginAndEmailTerm extends Pagination {
  public readonly searchLoginTerm: string | null;
  public readonly searchEmailTerm: string | null;

  constructor(query: ParsedQs, sortProperties: string[]) {
    super(query, sortProperties);

    this.searchLoginTerm = query.searchLoginTerm?.toString() || null;
    this.searchEmailTerm = query.searchEmailTerm?.toString() || null;
  }
}

export class PaginationWithSearchNameTerm extends Pagination {
  public readonly searchNameTerm: string | null;

  constructor(query: ParsedQs, sortProperties: string[]) {
    super(query, sortProperties);

    this.searchNameTerm = query.searchNameTerm?.toString() || null;
  }
}
