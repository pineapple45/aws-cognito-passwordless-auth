import { ComponentProps } from "react"
import { FormLabel } from "react-bootstrap"

export interface Input {
    label: string
    inputType: ComponentProps<typeof FormLabel>["type"]
    placeholder: string
    controlId: string
    defaultValue?: ComponentProps<typeof FormLabel>["type"]
    value?: ComponentProps<typeof FormLabel>["type"]
    required?: boolean
    inputCall: (inputVal: ComponentProps<typeof FormLabel>["type"]) => void
}
