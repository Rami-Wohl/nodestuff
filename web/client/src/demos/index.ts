import type { Demo } from '../shell.ts';
import { parseVsExecute } from './01-01-parse-vs-execute.ts';
import { ecmascriptVsHost } from './01-01-ecmascript-vs-host.ts';

// Order here is the order in the navigation.
export const demos: Demo[] = [parseVsExecute, ecmascriptVsHost];
