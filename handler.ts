import { Context } from 'aws-lambda'
import smartApp from './smartApp'

export function handle(event: any, context: Context, callback: () => any) {
    smartApp.handleLambdaCallback(event, context, callback)
}