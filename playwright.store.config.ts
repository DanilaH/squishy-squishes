import { defineConfig } from '@playwright/test';
import release from './playwright.release.config';
export default defineConfig({...release,testDir:'./tests/store-capture',testIgnore:[],timeout:120000,retries:0});
