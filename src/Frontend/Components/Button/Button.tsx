// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import MuiTooltip from '@mui/material/Tooltip';
import { ReactElement } from 'react';

import { tooltipStyle } from '../../shared-styles';

export interface ButtonProps
  extends Pick<MuiButtonProps, 'disabled' | 'onClick' | 'color'> {
  buttonText: string;
  tooltipText?: string;
  tooltipPlacement?: 'left' | 'right' | 'top' | 'bottom';
}

export function Button(props: ButtonProps): ReactElement {
  return (
    <MuiTooltip
      sx={tooltipStyle}
      title={props.tooltipText}
      placement={props.tooltipPlacement}
      describeChild={true}
    >
      <span>
        <MuiButton
          variant={'contained'}
          color={props.color}
          disabled={props.disabled}
          onClick={props.onClick}
        >
          {props.buttonText}
        </MuiButton>
      </span>
    </MuiTooltip>
  );
}
