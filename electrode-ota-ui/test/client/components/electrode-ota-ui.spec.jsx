/**
 * Client tests
 */
import React from "react";
import { shallow } from "enzyme";

import ElectrodeOtaUi from "src/components/electrode-ota-ui";

describe("components/electrode-ota-ui", () => {

  describe("Mounting", () => {

    it("should render into the document", () => {
      const component = shallow(<ElectrodeOtaUi />);
      expect(component).to.not.be.null;
    });

  });

});
