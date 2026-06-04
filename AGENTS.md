# AGENTS.md

## Project Overview

This project implements a highly dynamic, spreadsheet-like data editor and viewer for the browser, built on top of the Absol and absol-acomp UI libraries. It supports complex data descriptors, formula evaluation, and custom field types, with a focus on extensibility and integration with custom business logic.

## Major Components & Data Flow

- **TableEditor** (`js/fragment/TableEditor.js`): Main interactive spreadsheet editor. Handles rendering, editing, selection, commands, and event flow. Uses `TableData` for data management.
- **FormArrayEditor** (`js/fragment/FormArrayEditor.js`): Specialized editor for array-of-form layouts. Uses `FATable` and `FARow` for row/field logic.
- **TableData** (`js/viewer/TableData.js`): Core data structure for tabular data, manages rows (`TDRecord`), columns, and configuration. Handles import/export and row operations.
- **TDRecord** (`js/viewer/TDRecord.js`): Represents a single row in the table, manages field instances and cell rendering.
- **Field Types** (`js/viewer/types/`): Each file implements a specific cell type (e.g., `TDEnum.js`, `TDText.js`). Extend `TDBase` and implement `attachView`, `loadDescriptor`, `loadValue`.
- **Editor Types** (`js/fragment/editor/`): In-cell editing UIs for `TableEditor` (e.g., `TDEText`, `TDENumber`). Registered by descriptor `type` via `TDEBase.typeClasses`.
- **Formula/Excel helpers** (`js/fx/`): Formula utilities used by the sheet runtime/export API (notably `ExcelFx`, `ExcelParser`, `TSFunction`, and `excelFormula2KVFormula` exported from `index.js`).
- **Abstractions** (`js/fragment/Abstractions.js`): Defines base classes for editors, fields, rows, and tables. Implements event and context propagation, formula/circuit logic, and property descriptor computation.
- **Demo & Example Data** (`demo/`, `example_data/`): Example usage, test harnesses, and sample data descriptors for rapid prototyping and manual testing.

## Developer Workflows

- **Build**: Use `npm run dev` for development server (webpack-dev-server), `npm run dist` for production build. Output is `absol/absol_sheet.js`.
- **Demo/Test**: Open `index.html` (loads `demo/index.js`), or run individual scripts in `demo/` for manual testing. Example data in `example_data/`.
- **No automated tests**: Testing is manual via the demo pages and console output.
- **Clipboard**: Copy/paste row data is implemented via localStorage (`setDataSheetClipboard`, `getDataSheetClipboard` in `js/util.js`).

## Project-Specific Conventions

- **Descriptors**: Data schema is defined by `propertyNames` and `propertyDescriptors` (see `example_data/ex_001.js`). Descriptors can include formulas (`calc`, `onchange`), validation, and custom field logic.
- **Formula Syntax**: Formulas use `=` prefix for expressions, `{{ ... }}` for multi-line JS. See `computeSheetDescriptor` in `js/util.js`.
- **Dynamic Field Types**: Field and cell types are mapped by string in descriptors to classes in `TDBase.typeClasses`, `TDEBase.typeClasses`, and `FAField.typeClasses`.
- **Event Model**: Uses custom event emitters and DOM signals for resize, property change, and command handling.
- **Extensibility**: New field types can be added by extending `TDBase` and registering in `typeClasses`.
- **Read-only/Headless Modes**: Controlled via options (`readOnly`, `headless`) in editor config.

## Integration & External Dependencies

- **Absol**: Core UI and DOM abstraction library.
- **absol-acomp**: Advanced UI components (menus, context, etc.).
- **Webpack**: Used for bundling, with Babel for ES6+ transpilation.
- **No backend**: All logic is client-side; data is loaded from JS modules or JSON.

## Key Files & Directories

- `js/fragment/TableEditor.js`, `js/fragment/FormArrayEditor.js`: Main editors.
- `js/fragment/editor/`: In-cell editor implementations used by `TableEditor`.
- `js/viewer/TableData.js`, `js/viewer/TDRecord.js`: Data and row logic.
- `js/viewer/types/`: Field/cell type implementations.
- `js/fx/`: Formula helpers (Excel-like functions + Excel-to-sheet formula conversion).
- `js/fragment/Abstractions.js`: Base classes and event logic.
- `js/util.js`: Utility functions, formula parsing, clipboard.
- `demo/`, `example_data/`: Usage examples and test data.

## Example: Adding a New Field Type

1. Create a new file in `js/viewer/types/`, e.g., `TDMyCustomType.js`.
2. Extend `TDBase`, implement `attachView`, `loadDescriptor`, `loadValue`.
3. Register in `TDBase.typeClasses`.
4. Reference by `type` in a property descriptor.

## Example: Descriptor with Formula

```js
propertyDescriptors: {
  salary: {
    type: 'number',
    calc: '= baseSalary * 1.2',
    required: true
  }
}
```

## Example: Manual Test

```js
var data = require('../example_data/ex_001.js');
var editor = new absol.sheet.TableEditor();
editor.setData(data);
editor.getView().addTo(document.body);
```

