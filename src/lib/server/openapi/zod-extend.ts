import "server-only";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/** Call once before any `.openapi()` metadata or registry use. */
extendZodWithOpenApi(z);

export { z };
