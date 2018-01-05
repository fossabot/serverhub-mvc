import { GlobalEnvironmentVariables } from "../global";
import { IncomingMessage, ServerResponse } from "http";
import { ControllerBundle, Register } from "./register";
import { RuntimeError, ErrorManager } from "../error/error";
import { ApplyModel } from '../view/view';
import { ReadModel } from '../model/model';
import { Route, RouteValue } from "../../route/route";

class ControllerCollection {
    private Controllers = {};
    public Add(bundle: ControllerBundle): void {
        this.Controllers[bundle.Name] = bundle;
    }
    public Remove(controllerName: string): ControllerBundle {
        if (this.Controllers.hasOwnProperty(controllerName)) {
            let bundle = this.Controllers[controllerName];
            delete this.Controllers[controllerName];
            return bundle;
        }
        return void 0;
    }
    public Has(controllerName: string): boolean {
        if (this.Controllers.hasOwnProperty(controllerName)) {
            return true;
        }
        return false;
    }
    public DispatchController(controllerName: string, actionName: string, idString: string, search: string, dispatch: ControllDispatch): boolean {
        if (this.Has(controllerName)) {
            let controller = (this.Controllers[controllerName] as ControllerBundle).Controller as Object;
            let matched = false;
            Object.keys(controller).map(action => {
                if (action === actionName.toLowerCase()) {
                    let context = ReadModel(controllerName);
                    context = controller[action](dispatch.Request, dispatch.Response, context, dispatch.Method);
                    dispatch.Response.setHeader('content-type', 'text/html; charset=utf-8');
                    dispatch.Response.write(ApplyModel(controllerName, context));
                    dispatch.Response.end();
                    matched = true;
                }
            });
            return matched;
        } else throw new Error(ErrorManager.RenderError(RuntimeError.SH020101, controllerName));
    }
}



export class Controller {
    /**
     * Register
     */
    private static Collection = new ControllerCollection();

    public static Register(controller: string) {
        Controller.Collection.Add(Register(controller));
    }
    public static Unregister(controllerName: string) {
        Controller.Collection.Remove(controllerName);
    }

    public static Dispatch(method: string, route: RouteValue, request: IncomingMessage, response: ServerResponse): boolean {
        return Controller.Collection.DispatchController(route.Controller, route.Action, route.Id, route.Search, {
            Method: method,
            Request: request,
            Response: response
        } as ControllDispatch);
    }

}

interface ControllDispatch {
    Method: string;
    Request: IncomingMessage;
    Response: ServerResponse;
}

