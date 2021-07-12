import 'absol/src/dependents';
import '@babel/traverse';
import generate from  '@babel/generator';
import presetEnv from '@babel/preset-env';
import regeneratorRuntime from "regenerator-runtime/runtime";
babel.generate = generate;
babel.presetEnv = presetEnv;
babel.regeneratorRuntime = regeneratorRuntime;