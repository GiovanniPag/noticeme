package com.giovannip.noticeme.cucumber;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("com/giovannip/noticeme/cucumber")
@ConfigurationParameter(
	    key = GLUE_PROPERTY_NAME,
	    value = "com.giovannip.noticeme.cucumber.stepdefs,com.giovannip.noticeme.cucumber"
	)
	@ConfigurationParameter(
	    key = PLUGIN_PROPERTY_NAME,
	    value = "pretty, html:target/cucumber-reports/Cucumber.html"
	)
class CucumberIT {}