/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import AccountView  from 'dashboard/AccountView.react';
import AppsManager  from 'lib/AppsManager';
import history      from 'dashboard/history';
import howLongAgo   from 'lib/howLongAgo';
import html         from 'lib/htmlString';
import Icon         from 'components/Icon/Icon.react';
import LiveReload   from 'components/LiveReload/LiveReload.react';
import pluralize    from 'lib/pluralize';
import prettyNumber from 'lib/prettyNumber';
import React        from 'react';
import styles       from 'dashboard/Apps/AppsIndex.scss';
import { center }   from 'stylesheets/base.scss';
import { Link }     from 'react-router';

function dash(value, content) {
  if (value === undefined) {
    return '-';
  }
  if (content === undefined) {
    return value;
  }
  return content;
}

let CloningNote = ({ app, clone_status, clone_progress }) => {
  if (clone_status === 'failed') {
    //TODO: add a way to delete failed clones, like in old dash
    return <div>Clone failed</div>
  }
  let progress = <LiveReload
    initialData={[{appId: app.applicationId, progress: clone_progress}]}
    source='/apps/cloning_progress'
    render={data => {
      let currentAppProgress = data.find(({ appId }) => appId === app.applicationId);
      let progressStr = currentAppProgress ? currentAppProgress.progress.toString() : '0';
      return <span>{progressStr}</span>;
    }}/>
  return <div>Cloning is {progress}% complete</div>
};

let CountsSection = ({ className, title, children }) =>
 <div className={className}>
   <div className={styles.section}>{title}</div>
   {children}
 </div>

let Metric = (props) => {
  return (
    <div className={styles.count}>
      <div className={styles.number}>{props.number}</div>
      <div className={styles.label}>{props.label}</div>
    </div>
  );
};

let AppCard = ({
  app,
  icon,
}) => <li onClick={() => history.pushState(null, html`/apps/${app.slug}/browser`)}>
  {icon ? <a className={styles.icon}><img src={icon} /></a> : null}
  <CountsSection className={styles.glance} title='At a glance'>
    <Metric number={dash(app.users, prettyNumber(app.users))} label='total users' />
    <Metric number={dash(app.installations, prettyNumber(app.installations))} label='total installations' />
  </CountsSection>
  <div className={styles.details}>
    <a className={styles.appname}>{app.name}</a>
    <div className={styles.serverVersion}>Server version: <span className={styles.ago}>{app.serverInfo.parseServerVersion || 'unknown'}</span></div>
  </div>
</li>

export default class AppsIndex extends React.Component {
  constructor() {
    super();
    this.state = { search: '' };
    this.focusField = this.focusField.bind(this);
  }

  componentWillMount() {
    document.body.addEventListener('keydown', this.focusField);
    AppsManager.getAllAppsIndexStats().then(() => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    document.body.removeEventListener('keydown', this.focusField);
  }

  updateSearch(e) {
    this.setState({ search: e.target.value });
  }

  focusField() {
    if (this.refs.search) {
      this.refs.search.focus();
    }
  }

  render() {
    let search = this.state.search.toLowerCase();
    let apps = AppsManager.apps();
    if (apps.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={center}>
            <div className={styles.cloud}>
              <Icon width={110} height={110} name='cloud-surprise' fill='#1e3b4d' />
            </div>
            <div className={styles.alert}>You don't have any apps</div>
          </div>
        </div>
      );
    }
    apps.sort((a, b) => a.createdAt > b.createdAt ? -1 : (a.createdAt < b.createdAt ? 1 : 0));
    return (
      <div className={styles.index}>
        <div className={styles.header}>
          <Icon width={18} height={18} name='search-outline' fill='#788c97' />
          <input
            ref='search'
            className={styles.search}
            onChange={this.updateSearch.bind(this)}
            value={this.state.search}
            placeholder='Start typing to filter&hellip;' />
        </div>
        <ul className={styles.apps}>
          {apps.map(app =>
            app.name.toLowerCase().indexOf(search) > -1 ?
              <AppCard key={app.slug} app={app} /> :
              null
          )}
        </ul>
      </div>
    );
  }
}
