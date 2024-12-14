#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {ChatIotCoreStack} from '../lib/chat-iot-core-stack';

const app = new cdk.App();
new ChatIotCoreStack(app, 'ChatIotCoreStack');