export type ICreateCategory = {
  name: string;
  description?: string | null;
  /** Parent category. Null or absent means a root-level category. */
  parentId?: number | null;
  sortOrder?: number;
};

export type IUpdateCategory = Partial<ICreateCategory>;

export type ICategoryQuery = {
  /** "true" nests children under their parent; anything else returns a flat list. */
  tree?: string | boolean;
};
